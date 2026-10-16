# QA – Round 2, Sprint 1: runner kiểm quyền, E2E API theo story, UI smoke admin-web

- Vai: QA | Ngày: 16/10/2026 | Không commit (ORC commit)
- Máy: macOS, Node 22, pnpm 9.15.4, OrbStack; stack `docker compose` dev đang chạy (api healthy, web, worker, postgres – DS-E đã nạp: `qa.owner`… có trong `app_user`)
- Mọi số liệu "chạy" dưới đây là **chạy thật** lúc viết báo cáo. Lúc chạy, build api **chưa có endpoint nghiệp vụ Sprint 1 nào** (chỉ `/health` và `/__test__/*`): `POST /v1/auth/login` → 404, `GET /v1/me` → 404. Vì vậy mọi ca cần API Sprint 1 đều **skipped có lý do** (pending), không có ca đỏ.

## 1. Bảng trạng thái

| Việc ORC giao | Kết quả | Trạng thái |
|---|---|---|
| (1) Runner kiểm quyền từ `rbac-cases.json` trên stack compose | `e2e/rbac/` – 385 ca của 36 operation Sprint 1 (auth/me, users, devices, platform rooms+params, guests, audit, approvals): 188 kỳ vọng 2xx, 162 × 403, 35 × 401. Đăng nhập thật bằng `qa.*` + `QA_SEED_PASSWORD`; dò endpoint tự động → ca chưa có endpoint = **pending (skipped)**; 44 ca 2FA = **R3 (skipped)** | **Xong code**; chạy thật: 0 đạt / 0 đỏ / 385 skipped (chờ BE). Cơ chế đã tự kiểm trên API giả lập (mục 3.3) |
| (2) E2E API theo TC Sprint 1 | `e2e/api/` – 41 test mang mã TC: đăng nhập + cookie (TC-NT-001, TC-SEC-020), tài khoản locked (TC-NT-005), **khóa sau 5 lần sai** (TC-NT-043 mới), **tạo user trùng** (TC-NT-044 mới), **đổi vai thu hồi mọi phiên** (TC-NT-007 + TC-SEC-022a), đặt lại mật khẩu/khóa tài khoản (TC-SEC-022b,c), mật khẩu tạm (TC-SEC-025), MGR không quản lý user (TC-NT-010); tham số ngoài biên (TC-NT-012, TC-NT-041, TC-NT-042), **tham số bảo mật chỉ owner** (TC-NT-013, TC-NT-014, TC-SEC-028), lịch sử tham số (TC-NT-015); căn định mức/tối đa + lỗi `MAX_OCCUPANCY_RANGE` (TC-NT-040e); khách: bắt buộc trường, chuẩn hóa, **chặn trùng SĐT/email** (TC-L5-043), nghi trùng tên đảo + ngày sinh (TC-L5-044), **tìm có/không dấu** (TC-L5-045), tra cứu (TC-L5-046), giữ mã KH (TC-NT-038), phạm vi M của SAL/CTV (TC-RB-010 phần khách); nhật ký từ chối quyền (TC-NT-008 biến thể S1), FD chỉ thấy nhật ký của mình (TC-NT-017 (2)(3)); phê duyệt: hộp duyệt + 404 (TC-NT-027 phần hợp đồng), **không tự duyệt** (TC-NT-030) | **Xong code**; chạy thật: 0/0/41 skipped – mỗi ca ghi mã TC + operation đang chờ |
| (3) UI smoke admin-web (chờ FE) | `e2e/ui/admin-web.smoke.spec.ts` – 11 test: TC-NT-002 (E), TC-NT-001 (E), TC-NT-006 × 8 vai (màn mặc định + menu), TC-NT-010 (E). Nhãn lấy từ `design/copy/strings-vi.json` | **Xong dạng skip** – bật bằng `E2E_UI=1` khi FE có màn đăng nhập (cần `playwright install chromium`, máy này chưa cài) |
| (4) test-strategy / traceability | test-strategy **0.4** (mục 2.2 mới, cột "Đặt ở đâu" tầng A/R); test case **v0.3.1** thêm TC-NT-043, TC-NT-044; smoke-manifest: 5 ca (S) chuyển `implemented` (TC-NT-001, TC-SEC-022, TC-SEC-028, TC-RB-018, TC-RB-023); `gen_traceability.py --strict` **exit 0** (395 TC, 72/72 story, 250/250 AC) | **Xong** |
| Chạy thật toàn bộ | `playwright test` (mọi project): **477 test – 2 passed (TC-X-050a,b), 475 skipped, 0 failed** | Đúng kỳ vọng với build hiện tại |

## 2. Đã làm gì

### 2.1 Runner quyền (`product/tests/e2e/rbac/`)
- `cases.ts` lọc `fixtures/rbac-cases.json` (không sửa tay, `gen_rbac_cases.py --check` OK) theo `sprint1-ops.ts`.
- `sprint1-ops.ts` định nghĩa cách gọi từng operation để **chỉ quan sát cổng vai, không để lại dữ liệu**:
  - đọc (`read`): GET/lookup hợp lệ – chỉ chấp nhận 2xx;
  - ghi **không** idempotent (`invalid`): guard kiểm `x-roles` trước handler (`AuthGuard.canActivate` → `enforce`), nên gửi body cố ý sai → vai bị cấm nhận 403, vai được phép nhận 422/412, không ghi gì (changeMyPassword, setMyApprovalPin, stepUp, updateUser, setUserRoles, updateRoom, setParameter, updateGuest);
  - ghi **có** Idempotency-Key (`valid`): vai được quyết **sau** bước tra khóa (UnitOfWork) nên body phải hợp lệ – dùng dữ liệu tạm (createUser `qa.e2e.rb*`, createGuest email `.test`) hoặc id ngẫu nhiên (createRoom với `roomGroupId` ngẫu nhiên, revoke/approve/reject/cancel với id ngẫu nhiên → chấp nhận 404);
  - `If-Match` luôn gửi cho operation cần (nếu thiếu, server trả 428 trước khi kiểm vai – thứ tự của `AuthGuard`).
- Kỳ vọng: 2xx → không `401 UNAUTHENTICATED`, không `403 FORBIDDEN_ACTION`, không 5xx, và 2xx hoặc thuộc `accept`; 403 → `FORBIDDEN_ACTION`; 401 → cookie khách giả đúng định dạng (`ottimo_gsid`) trên operation nhân viên. Mỗi test ghi annotation `actual` (mã HTTP + `Problem.code`).
- `logout` tách sang project `rbac-logout` chạy sau `rbac` + `api` (hủy phiên đang cache), kèm kiểm TC-NT-003 bước 2 (cookie cũ sau logout → 401).
- Biến thể ngoài phạm vi (`own` → 404) không chạy trong runner; viết ở spec nghiệp vụ (TC-RB-010 phần khách).

### 2.2 Hạ tầng E2E dùng chung (`product/tests/e2e/support/`, `global-setup.ts`, `playwright.config.ts`)
- `api.ts`: client trên Playwright request API – cookie phiên gửi tường minh (một context dùng cho nhiều người), `X-CSRF-Token` = `Me.csrfToken` + `Origin` cho method ghi (SR-SES-04), `Idempotency-Key`, `If-Match`, `expectProblem`, tạo/kích hoạt tài khoản tạm, `/__test__/clock`.
- **Dò endpoint**: gọi ẩn danh – route đã có trả 401 (guard chạy trước mọi tra cứu), route chưa có trả 404 → `requireEndpoints()` skip ca với mã TC.
- **Ngân sách đăng nhập** (SR-RL-01: 20 lần/IP/15 phút): `global-setup` đăng nhập 10 tài khoản DS-E một lần, lưu `e2e/.auth/sessions.json` (gitignore, 0600), kiểm lại bằng `getMe` ở lần sau. Ca khóa tài khoản và đặt lại mật khẩu đi qua Caddy (`E2E_WEB_URL`, IP khác với api). Gặp 429 ngoài ca khóa → skipped "môi trường".
- Bí mật: `QA_SEED_PASSWORD`, `TEST_SUPPORT_TOKEN` đọc từ env hoặc `product/.env` (chỉ 2 khóa), không in ra. Tua đồng hồ dùng chung chỉ khi `E2E_CLOCK_CONTROL=1`.
- Config: thêm project `rbac`, `api`, `rbac-logout` (dependencies), `desk-chromium` nhận `flows/` + `ui/` (bỏ `*.mobile.spec.ts`), `globalSetup`. `tsconfig` thêm lib DOM (spec UI).

### 2.3 Quyết định trong quyền QA (đề nghị ORC ghi `01-decisions/decision-log.md` khi commit)
- Runner quyền động dùng `rbac-cases.json` (sinh từ `x-roles`) vì TC-RB-023 đã chứng minh 0 lệch với rbac-matrix – không trái FB-R1-BA-QA-03.
- Kỳ vọng "2xx" của runner = **cổng vai cho qua** (không 401/403 cổng, không 5xx), không phải "thao tác thành công" – kết quả nghiệp vụ kiểm ở spec story.
- Endpoint chưa có / story R3 → skipped có lý do, **không tính lỗi** (plan W8).

## 3. Lệnh đã chạy và kết quả

| Lệnh | Kết quả |
|---|---|
| `curl -X POST :3000/v1/auth/login` / `GET /v1/me` / `GET /__test__/clock` | 404 / 404 / 401 – build chưa có identity; TestSupportModule có mặt |
| `docker exec … psql -c "select username,status from app_user"` | DS-E đã nạp (`qa.owner`…`qa.locked` locked); có thêm tài khoản `qa.*.xxxxxx`, `t.*` do test BE ghi vào cùng DB dev (mục 5) |
| `playwright test -c e2e/playwright.config.ts` (mọi project, stack thật) | **477 test: 2 passed, 475 skipped, 0 failed**. smoke 2 passed + 38 skipped; rbac 374 skipped (330 pending + 44 R3); rbac-logout 11 pending; api 41 skipped (mã TC + operation chờ); desk-chromium 11 skipped (chờ FE) |
| 3.3 Tự kiểm harness trên API giả lập (Node, 127.0.0.1:3999, ngoài repo, đã tắt) có login/getMe/logout/listUsers/setParameter | rbac: getMe 11, listUsers 11, setParameter 11 **passed** (403 `FORBIDDEN_ACTION`, 401 cookie khách, 422 body sai cho vai được phép, CSRF header gửi đúng); rbac-logout 11 passed; api: TC-NT-001, TC-SEC-020, TC-NT-005, TC-NT-002 passed; global-setup = **10 lần đăng nhập** (cache hoạt động). 2 ca đỏ là do API giả trả 422 cho mọi khóa (đúng là phải đỏ) |
| `pnpm --filter @ottimo/tests typecheck` | xanh |
| `pnpm --filter @ottimo/tests test` (validate-fixtures) | OK – 0 lỗi, 1 cảnh báo cũ (OTM-0108); smoke-manifest 42 (S): implemented 6, pending 37 |
| `python3 tests/tools/gen_traceability.py --strict` | **exit 0** – 395 TC, 72/72 story, AC 250/250, ops mismatched 0 |
| `python3 tests/tools/gen_rbac_cases.py --check` | OK – up to date (1914 ca) |
| `prettier --check tests` / `eslint tests` | xanh / sạch (`prettier --check .` toàn repo còn cảnh báo ở `apps/admin-web`, `services/api`, `packages/*` – file của FE/BE đang sửa, không thuộc QA) |

## 4. Giả định
- Thứ tự kiểm theo `AuthGuard` hiện có: xác thực → thiết bị → `Idempotency-Key`/`If-Match` có mặt → vai (operation có Idempotency-Key: vai quyết sau khi tra khóa). Nếu BE-B đổi thứ tự (ví dụ validate body trước guard) thì ca `invalid` có thể nhận 422 thay vì 403 → sẽ hiện đỏ rõ ràng, QA chỉnh `sprint1-ops.ts`.
- Hình dạng phản hồi chưa có trong code (list `{data: []}` hay mảng; lịch sử tham số; cảnh báo nghi trùng; `existingGuestId`; `min`/`max` ở thân `PARAM_OUT_OF_RANGE`) theo OpenAPI 0.3.2; chỗ hợp đồng chưa rõ thì kiểm lỏng (tìm id/chuỗi trong JSON) và ghi `actual-code` vào annotation.
- TC-NT-012 chấp nhận `VALIDATION_FAILED` hoặc `PARAM_OUT_OF_RANGE` (bounds 0003 cho `hold_hours_default` là 1–72; luật "thuộc `hold_hours_options`" là ràng buộc chéo ở ứng dụng), lỗi phải ở trường `value`.
- TC-NT-042: `short_stay_deposit_pct` 0–100 và `booking_window_days` 30–730 lấy từ migration 0003 (erd 9.1a) → kỳ vọng `PARAM_OUT_OF_RANGE` + min/max đã xác định; `late_grace_until`, `min_stay` chấp nhận cả hai mã (nhãn UNDECIDED giữ nguyên).
- TC-NT-013 bước (4) `channel_commission_pct.agoda` không phải khóa `config_parameter` (catalogue 0002 không có) – để lại tới khi có API kênh.
- Ca ghi tham số dùng `effectiveFrom` ngẫu nhiên 2028–2030 → không đổi hành vi hiện tại của stack dùng chung, không cần hoàn tác.
- SĐT giả dùng đầu `0939` + 6 số ngẫu nhiên (đầu `0000` của DS-0 có thể bị BR-951 từ chối khi tạo qua API); email miền `.test`.

## 5. Rủi ro / việc chưa xong
1. **Chưa có kết quả đạt/không đạt nào cho Sprint 1** – build chưa có endpoint. Khi BE-A/BE-B đẩy identity/platform/guests: chạy lại `--project=rbac --project=api --project=rbac-logout`; dự kiến phải chỉnh nhỏ theo hình dạng phản hồi thật (mục 4).
2. **Phê duyệt "không tự duyệt" (TC-NT-030)** chưa chạy được ở Sprint 1: không có nguồn tạo yêu cầu duyệt trước folio/FOC (`requestFoc`). Spec đã đặt chỗ (`test.fixme`) – fixture đơn in_house → dòng folio → FOC viết khi Sprint 2–3 có folio. Đề nghị BE cân nhắc test tích hợp tầng A cho SELF_APPROVAL_FORBIDDEN ngay ở Sprint 1 (gọi service trực tiếp).
3. **Nhật ký tiền (TC-NT-016, TC-NT-017(1))**: chờ thao tác tiền (folio). Ở Sprint 1 chỉ kiểm được nhật ký từ chối quyền, nhật ký bảo mật/cấu hình và phạm vi "own".
4. **CSRF/Origin** (TC-SEC-023) chưa viết ca riêng: `AuthGuard` hiện ghi "CSRF/Origin – identity module, BE-B" (chưa có). Harness đã gửi header đúng; ca âm (thiếu/sai token, Origin lạ) thêm khi BE-B xong.
5. **Căn**: DS-E chưa nạp phòng/nhóm căn (`PENDING_BLOCKS` của loader) → TC-NT-040(e) tự skip tới khi BE-B nạp; TC-NT-039/040(a–d)/020/018/019 chờ đơn đặt phòng (Sprint 2).
6. **DB dev dùng chung**: thấy tài khoản `qa.fd.0fa138`, `t.owner.*`… do test BE ghi vào DB `ottimo` của stack dev; E2E QA cũng tạo tài khoản tạm `qa.e2e.*` và khách `E2E …`. Không chặn, nhưng đề nghị OPS/BE: test tích hợp dùng `ottimo_test`; QA sẽ thêm lệnh dọn dữ liệu E2E khi có endpoint khóa/xóa mềm.
7. **SR-RL-01**: chạy lại toàn bộ trong < 15 phút có thể chạm 20 lần đăng nhập/IP (ca khóa tài khoản dùng 7 lần) – các ca đó tự skip "môi trường". CI dùng stack mới mỗi lần nên không ảnh hưởng.
8. **UI smoke** cần FE chốt route (`/rack`, `/settings/users`, `/settings/parameters`) và nhãn trường đăng nhập; QA chỉnh selector khi FE có màn. Máy này chưa cài trình duyệt Playwright.
9. Sửa nhỏ ngoài thư mục QA: `product/.prettierignore` thêm `tests/e2e/.auth/` (cache phiên) – ORC lưu ý khi commit.

## 6. File tạo/sửa
- Tạo: `product/tests/e2e/support/env.ts`, `product/tests/e2e/support/api.ts`, `product/tests/e2e/global-setup.ts`, `product/tests/e2e/rbac/cases.ts`, `product/tests/e2e/rbac/sprint1-ops.ts`, `product/tests/e2e/rbac/rbac-sprint1.spec.ts`, `product/tests/e2e/rbac/rbac-logout.spec.ts`, `product/tests/e2e/api/identity.api.spec.ts`, `product/tests/e2e/api/platform.api.spec.ts`, `product/tests/e2e/api/guests.api.spec.ts`, `product/tests/e2e/api/audit-approvals.api.spec.ts`, `product/tests/e2e/ui/admin-web.smoke.spec.ts`, `rounds/round-02/outputs/QA/s1-report.md`
- Sửa: `product/tests/e2e/playwright.config.ts`, `product/tests/e2e/smoke-manifest.json`, `product/tests/tsconfig.json`, `product/tests/README.md`, `product/tests/test-cases/r1-main-flows.md` (v0.3.1: TC-NT-043, TC-NT-044), `product/docs/qa/test-strategy.md` (0.4), `product/docs/qa/traceability.md` (sinh lại), `product/.prettierignore` (1 dòng)

## 7. Bước Kiểm thử Sprint 1 (16/10/2026, commit `d7d42e4`)
- Đã làm: dựng stack compose dùng một lần `ottimo-qa-r2s1` (cổng 15432/13000/18081), migrate + seed DS-E; chạy thật RBAC runner, E2E API, smoke; UI smoke admin-web chạy tay trên trình duyệt với API thật (Playwright chưa có trình duyệt); review QA→BE (8 thẻ), QA→FE (5 thẻ); dọn stack.
- Kết quả: RBAC 288 đạt / 9 trượt / 88 bỏ qua; API 29 / 3 / 10; smoke 3 / 0 / 37; UI tay 11 / 0 / 0; vitest admin-web 62 / 2. Chi tiết `rounds/round-02/qa/s1-test-report.md`.
- Lỗi mới: BUG-R2-005 (P1, BE), BUG-R2-006 (P1, FE+OPS), 007/008/009 (P2), 010/011 (P3), 012 (P2, QA – Closed), 013 (P3, QA – Fixed).
- File tạo/sửa: `rounds/round-02/qa/{s1-test-report.md, bug-list.md}`, `rounds/round-02/reviews/{QA-on-BE.md, QA-on-FE.md}`, `product/tests/e2e/{support/api.ts, rbac/sprint1-ops.ts, api/identity.api.spec.ts, api/guests.api.spec.ts, api/audit-approvals.api.spec.ts, smoke/health.spec.ts}`, `product/tests/README.md`, `01-decisions/decision-log.md` (2 dòng QA).
- Giả định: định dạng SĐT API `+84…` chấp nhận tạm (chờ ARC chốt); `changeMyPassword` xoay cookie là đúng (SR-SES-02) dù OpenAPI ghi "giữ phiên hiện tại".
- Rủi ro / chưa xong: chưa có staging; Playwright UI chưa chạy tự động; ca tua đồng hồ chạy song song làm lệch mốc thời gian – tách project tuần tự ở Sprint 2.

## 8. Sửa CI – job "docker images build · E2E smoke" (16/10/2026)
- **Chẩn đoán** (run `38887585274`, `gh run view --log-failed`): 289 trượt / 174 bỏ qua / 4 đạt. Dòng đầu log: `[e2e setup] qa.owner … 401 UNAUTHENTICATED` cho cả 10 tài khoản → `phiên DS-E sẵn sàng: 0/10`. Gốc: CI sinh `QA_SEED_PASSWORD` nhưng **không nạp seed DS-E** → không có tài khoản `qa.*`; harness đăng nhập lại ở từng ca → 20 lần/IP (SR-RL-01) cạn → 562 lỗi `429 RATE_LIMITED` (BUG-R2-015, P1). Đã tái hiện tại chỗ (stack mới chưa seed + `CI=true`).
- **Đã sửa (không nới giới hạn trong mã API)**:
  - `.github/workflows/ci.yml`: thêm bước `docker compose … run --rm seed` sau khi dựng stack (thuộc OPS – đề nghị OPS review).
  - `support/api.ts`: `resetRateLimits()` gọi `POST /__test__/rate-limits/reset` (X-Test-Token + phiên `qa.owner`; owner lấy từ cache → đăng nhập api → đăng nhập qua Caddy nếu IP api đã bị chặn); `login()`/`freshSession()` gặp 429 → reset + thử lại **1 lần**, lần 2 vẫn 429 mới ném `LoginRateLimited` (→ skip có lý do); `loginRaw()` không thử lại cho ca kiểm giới hạn; cache phiên theo tài khoản (bộ nhớ worker + `e2e/.auth/sessions.json`), chỉ đăng nhập lại khi `getMe` 401 (phiên bị thu hồi). Ca thu hồi phiên (đổi mật khẩu/vai/đặt lại/khóa) vẫn chỉ dùng tài khoản riêng `qa.e2e.*`.
  - Tiền tố reset **không** dùng `qa.` mặc định: endpoint mở khóa cả `qa.locked` (BUG-R2-014, P3, BE-A) → dùng `qa.owner, qa.mgr, qa.fd, qa.hk, qa.mt, qa.sal, qa.ctv` (+ `qa.e2e.lock` chỉ trong nhóm limits).
  - `global-setup.ts`: reset trước khi đăng nhập DS-E; CI mà 0/10 tài khoản đăng nhập được (401) → dừng ngay với 1 thông báo "chưa nạp seed DS-E" thay vì hàng trăm ca đỏ.
  - Ca khóa/giới hạn tách sang `e2e/limits/login-limits.spec.ts`, project `limits` tuần tự, sau `rbac` + `api`, reset trước/sau: TC-NT-043 (a), (b) tua đồng hồ, **(c) mới**: lần 21 từ một IP → 429, reset → hết chặn.
  - TC-X-050c (dừng PostgreSQL) tách sang `e2e/outage/db-outage.spec.ts`, project `db-outage` chạy cuối (trước đây chạy song song với rbac/api – BUG-R2-016).
- **Cập nhật kỳ vọng theo vòng sửa BE-A** (`responses/BE-A-responses.md` "Thay đổi hành vi"): (4) login từ origin guest-web → thêm ca TC-SEC-024 (đăng nhập) `403 FORBIDDEN_ACTION`, không cấp cookie – tự skip khi API không có danh sách origin (compose dev/CI không đặt `ADMIN_BASE_URL`/`GUEST_BASE_URL`); (2) người duyệt dưới cấp `403 APPROVAL_LIMIT_EXCEEDED` không `escalated` → thêm TC-NT-029 (d) vào test case (E2E chờ nguồn yêu cầu duyệt Sprint 2–3); changeMyPassword thu hồi mọi phiên → `activateUser` đã dùng cookie mới, kiểm lại đạt (TC-NT-007, TC-SEC-022). Mục (1) 403 trước 422/401 đã có TC-NT-008 – đạt.
- **Chạy thật như CI**: stack compose dùng một lần `ottimo-qa-ci` (bản `infra/docker-compose.yml` + override cổng 25432/23000/28081–28083, ảnh `:qa-ci`, `.env` sinh bằng `infra/ci/make-ci-env.sh`), migrate (service `migrate`), `run --rm seed`, `CI=true E2E_COMPOSE_CONTROL=1 pnpm test:e2e` (`E2E_COMPOSE_PROJECT`/`E2E_COMPOSE_ENV_FILE` trỏ stack QA). Stack dev `ottimo-dev` không bị đụng.

| Lần chạy | Đạt | Trượt | Bỏ qua | Ghi chú |
|---|---|---|---|---|
| 0 – stack chưa seed, `--project=smoke` | – | – | – | globalSetup dừng với thông báo "chưa nạp seed DS-E" (đúng ý) |
| 1 – như CI | **332** | **0** | 148 | 0 flaky |
| 2 – cùng stack, xóa cache phiên, **đốt trước cửa sổ IP** (22 lần sai → 429) + `E2E_CLOCK_CONTROL=1` | 333 | 0 | 147 | owner lấy qua Caddy → reset → 10/10 phiên; TC-NT-043 (b) đạt |
| 3 – cùng stack lần 3, như CI (bằng chứng chạy lại được) | **332** | **0** | **148** | smoke 2/0/37 · rbac 286/0/88 · api 30/0/11 · limits 2/0/1 · rbac-logout 11/0/0 · desk-chromium 0/0/11 · db-outage 1/0/0 |
| 4 – api có `ADMIN_BASE_URL`/`GUEST_BASE_URL` (như staging), `--project=rbac,api,limits,rbac-logout` | 330 | 0 | 99 | TC-SEC-024 (đăng nhập guest-web → 403) đạt |
| Ca tạm (đã xóa): đốt cửa sổ IP giữa lượt rồi `login`/`freshSession`/`session` | 1 | 0 | 0 | đường "429 → reset → thử lại" chạy đúng |

- Lý do bỏ qua (lần 3): rbac 44 R3 (2FA) + 44 pending (endpoint chưa có); api 10 chờ tính năng Sprint 2–3 + 1 TC-SEC-024 (stack không cấu hình origin); limits 1 TC-NT-043 (b) cần `E2E_CLOCK_CONTROL=1` (CI không bật); smoke 37 pending; ui 11 chờ FE (`E2E_UI`).
- Kiểm tĩnh: `tsc` tests, ESLint, Prettier, `validate-fixtures` 0 lỗi, `gen_traceability.py --strict` (đã sinh lại `docs/qa/traceability.md`), `gen_rbac_cases.py --check` đều xanh. Đã dọn stack (`down --volumes`, xóa ảnh `:qa-ci`, `.env` tạm, `sessions.json`).
- **Chưa xong / rủi ro**: chưa có lần chạy trên GitHub (QA không commit/push – chờ ORC); CI vẫn không kiểm origin (compose không đặt `ADMIN_BASE_URL`/`GUEST_BASE_URL`) – đề nghị OPS cân nhắc đặt trong compose CI; nếu dependency `rbac`/`api` đỏ thì `limits`, `rbac-logout`, `db-outage` bị bỏ không chạy (thiết kế Playwright).
- File tạo/sửa: `.github/workflows/ci.yml`; `product/tests/e2e/{support/api.ts, support/env.ts, global-setup.ts, playwright.config.ts, api/identity.api.spec.ts, api/audit-approvals.api.spec.ts, smoke/health.spec.ts, smoke-manifest.json}`; mới `product/tests/e2e/limits/login-limits.spec.ts`, `product/tests/e2e/outage/db-outage.spec.ts`; `product/tests/test-cases/r1-main-flows.md` (v0.3.2), `product/tests/README.md`, `product/docs/qa/traceability.md`; `rounds/round-02/qa/bug-list.md` (BUG-R2-013 Closed, 014–016).
