# BE-A – Round 2, Đợt 0: Khung nền (module 1, phần (a) + phần lớn (b))

- Vai: BE (luồng BE-A) | Ngày: 16/10/2026 | Không commit (ORC commit) | Plan R2 mục 3.3, 4; BE w1-report mục 2.1
- Đầu vào: ADR-002/003/007/008/009, erd 0.3.1 (mục 1, 2, 4.1–4.3, 4.12, 9, 9.1a, 9.3, 10, 16), architecture 9.1/9a/13, coding-standards 0.2, OpenAPI 0.3.1-draft + `openapi.test.yaml`, SEC `w1-review.md`, ARC `d0-contract.md`, `tests/fixtures/seed/ds-e.json`.
- Kết quả: phần (a) xong trọn; phần (b) xong problem+json, Idempotency-Key, guard `x-roles`, `DocNumberService`, `ParameterService`, MutableClock + `/__test__`; **chưa làm** serializer `x-visible-to`, CSRF/Origin, `If-Match`/412 dùng chung (mục 5).

## 1. Thay đổi theo nhóm (gợi ý tách commit cho ORC)

| # | Nhóm (commit gợi ý) | Nội dung | File chính |
|---|---|---|---|
| C1 | `build(api): add drizzle, uuid, zod, argon2` | `drizzle-orm@0.45.4` (ghim chính xác – ADR-002), `drizzle-kit@0.31.11` (dev), `uuid@^11`, `zod@^4`, `@node-rs/argon2`, `yaml` (dev). Script `db:migrate`, `db:generate(:custom)`, `seed:ds-e`, `gen:openapi`; build chép migration vào `dist/db/migrations`. Không có script `drizzle-kit push` (test chặn) | `services/api/package.json`, `product/package.json`, `pnpm-lock.yaml`, `services/api/drizzle.config.ts`, `scripts/copy-migrations.mjs` |
| C2 | `feat(db): foundation schema and migrations` | Drizzle schema + 4 migration: **0000** (drizzle-kit, sửa tay: extension, `audit_event`/`c3_access_log` PARTITION BY RANGE tháng) 16 bảng: `organization, property, app_user, user_property_role, user_session, trusted_device, config_parameter_def, config_parameter, doc_sequence, dev_clock, audit_event, c3_access_log, job_run, outbox_message, inbox_message, idempotency_key`; FK cặp `(organization_id, property_id)`; **0001** (custom) hàm `app_current_*` (NULLIF), ENABLE+FORCE RLS 14 bảng + policy 3 dạng, GRANT theo bảng (K8: log chỉ SELECT/INSERT), phân vùng 2026-10…2027-12 + DEFAULT, `log_ensure_month_partition()`, 4 hàm SECURITY DEFINER đường vào; **0002** catalogue 156 khóa (`config_parameter_def`: khóa DS-E + hệ thống + 8 tham số bảo mật có biên SEC từ OpenAPI + `doc_code_format.*`); **0003** biên erd 9.1a (86 khóa – yêu cầu ARC/ORC). Runner `migrate.ts`: đăng nhập `ottimo_migrator` → `SET ROLE ottimo_owner`, khóa advisory, chỉ tiến | `src/db/schema/*.ts`, `src/db/migrations/*`, `src/db/migrate.ts`, `src/db/migrate-cli.ts` |
| C3 | `feat(db): RLS transactions, startup checks (G4)` | `Database.withContext()` – câu đầu tiên mọi giao dịch là `set_config(…, true)` × 4, rollback an toàn, hủy kết nối hỏng; `entry()` cho hàm đường vào; `setTypeParser(20)` an toàn 2^53; đổi `src/db.ts` → `src/db/pinger.ts` (erd 16.7); `assertSafeDbRole` (không superuser/BYPASSRLS/không thuộc owner) + `assertProductionClock` (production: `dev_clock` phải rỗng) chạy lúc khởi động api **và** worker | `src/db/database.ts`, `pool.ts`, `startup-checks.ts`, `pinger.ts`, `src/bootstrap.ts` |
| C4 | `feat(api): MutableClock and test-support module` | `MutableClock` (offset/đóng băng trong `dev_clock`, cache 1 s, `NOTIFY clock_changed`, kết nối LISTEN riêng tự nối lại ≤ 30 s), `FixedClock` chỉ cho test, bỏ `CLOCK_OVERRIDE` (từ chối mọi môi trường); `CLOCK_MODE`; `src/shared/time.ts` (`businessDate` 06:00, `atLocal`, `toZonedIso` theo IANA). `src/test-support/`: `GET/POST /__test__/clock`, `POST /__test__/jobs/{key}/run` – cần `X-Test-Token` (so sánh thời gian hằng) **và** phiên owner, ghi `audit_event`; chỉ nạp khi `INCLUDE_TEST_SUPPORT=1` (cấm ở production) bằng `require('./test-support')` trong `main.ts`; chuỗi `__test__`/`TestSupportModule` chỉ nằm trong thư mục đó (test quét) | `src/clock.ts`, `src/db/clock-store.ts`, `src/shared/time.ts`, `src/test-support/*`, `src/main.ts`, `src/config.ts` |
| C5 | `feat(api): OpenAPI-driven guard, idempotency, problem+json` | Sinh `src/generated/openapi-meta.ts` từ `openapi.yaml` (182 operation: `x-roles`, `x-rbac`, `x-scope`, Idempotency-Key, If-Match, `x-requires-trusted-device`, `x-step-up`; bảng `Problem.code`; `x-security-parameters`), test `--check`. `AuthGuard` toàn cục, mặc định cấm route thiếu `@Operation`: phiên cookie → `auth_resolve_session` → vai ở cơ sở (cache 60 s theo `roles_version`), cơ sở không có vai → 404, sai vai → 403 + `audit_event access.denied`, thiết bị tin cậy → 403 `DEVICE_NOT_TRUSTED`, thiếu Idempotency-Key/If-Match → 428. `UnitOfWork`: khóa idempotency INSERT trong cùng giao dịch, trả lại phản hồi cũ (`Idempotent-Replayed`), khác body → 422, đang chạy → 409, kiểm vai **sau** tra khóa; `storeBody:false` cho C3. `ProblemFilter` RFC 9457 + `requestId`, `X-Request-Id`, không lộ SQL/stack. `/health` giữ JSON thường | `scripts/gen-openapi-meta.mjs`, `src/generated/openapi-meta.ts`, `src/shared/http/*`, `src/shared/problem.ts`, `src/shared/openapi-types.ts`, `src/http.ts`, `src/core.module.ts`, `src/app.module.ts`, `src/health/health.controller.ts` |
| C6 | `feat(platform): DocNumberService, ParameterService, audit, job runner` | `DocNumberService.allocate()` đúng câu SQL erd 10 (ON CONFLICT … RETURNING, cùng giao dịch), định dạng từ `doc_code_format.<type>` (BR-007), bill reset 1/1 giờ cơ sở, mã tổ chức `KH-`; `ParameterService.get/validate/set` (hiệu lực theo ngày, mặc định catalogue, biên SEC + biên 9.1a → `PARAM_OUT_OF_RANGE`, chỉ OWN với khóa bảo mật/khóa OWN, audit `security`/`config`, `NOTIFY config_changed`); `AuditService` (`audit_event`, `c3_access_log`, `access.denied`); `JobRunner` theo mẫu đúng-một-lần (job_run cùng giao dịch, slot gần nhất ≤ now, cửa sổ bắt kịp), job `log.partitions` (phần phân vùng của J16); worker tick mỗi phút | `src/modules/platform/public/*`, `src/modules/audit/public/audit.service.ts`, `src/jobs/*`, `src/worker.ts` |
| C7 | `fix(config): TRUST_PROXY ranges, required in staging/production` | FB-R2-SEC-BE-01/02 (mục 4) | `src/config.ts`, `test/config.test.ts` |
| C8 | `feat(seed): pnpm seed:ds-e` | Loader DS-E (mục 3) | `src/db/seed/ds-e.ts`, `src/db/seed/seed-cli.ts` |
| C9 | `test(api): RLS, architecture, platform, http, seed` | 121 test (mục 6) | `test/**` , `vitest.config.mts` (globalSetup migrate) |
| C10 | `docs: BE d0 foundation` | Báo cáo này, decision-log (8 dòng BE), `responses/BE-responses.md`, `reviews/BE-on-QA.md` | – |

## 2. Test mới (tất cả trên PostgreSQL 17.11 thật, vai `ottimo_app`; migrate bằng `ottimo_migrator`)
| File | Số ca | Nội dung chính |
|---|---|---|
| `test/integration/rls.test.ts` | 13 | **Cách ly 2 cơ sở cùng tổ chức** + 2 tổ chức; kết nối tái sử dụng (pool 1 kết nối) không ngữ cảnh → 0 dòng, không lỗi; WITH CHECK; FK cặp chặn trỏ chéo tổ chức (K11); **chống bypass**: `SET ROLE ottimo_owner/readonly`, `DISABLE/NO FORCE RLS`, `DROP POLICY`, `row_security=off`, đọc thẳng phân vùng, tạo bảng/hàm SECURITY DEFINER, UPDATE/DELETE/TRUNCATE log (K8), sửa catalogue → đều 42501 |
| `test/integration/architecture.test.ts` | 17 | Mọi bảng `public` ENABLE+FORCE RLS trừ danh sách ngoại lệ đóng (`config_parameter_def`, `dev_clock`); mọi bảng có `property_id/organization_id` có policy; K8; phân vùng; biên bảo mật catalogue = OpenAPI; biên 9.1a; migrate chạy lại = no-op; không có `drizzle-kit push`; 4 hàm đường vào chỉ trả cột erd 2.4, SECURITY DEFINER, owner, `search_path` cố định, PUBLIC không EXECUTE; startup checks (app nhận, migrator/superuser/BYPASSRLS từ chối, production + `dev_clock` có dòng → dừng) |
| `test/integration/platform.test.ts` | 16 | **50 request song song → 50 mã liên tiếp không trùng** (K3/US-023); rollback không hở số; bộ đếm theo cơ sở / `KH-` theo tổ chức; bill `F26-…` → `F27-000001` lúc 00:00 1/1 giờ VN; tham số theo ngày hiệu lực, mặc định catalogue, biên SEC/9.1a, chỉ OWN, không sửa giá trị đã hiệu lực, audit `security`; MutableClock api ↔ worker qua `NOTIFY`; JobRunner chạy song song → 1 `done` + 1 `skipped_already_ran`, lỗi → rollback cả `job_run`, nhắc trễ → `skipped_catchup_window`, `log.partitions` |
| `test/integration/http-foundation.test.ts` | 16 | Nest + Fastify thật: 401/403(+audit)/404 chéo tổ chức, route thiếu `@Operation` không phục vụ, 500 không lộ SQL, thiết bị tin cậy (không có/của tổ chức khác/đúng), Idempotency 428/422/replay/khác body/**2 request đồng thời cùng key → nghiệp vụ chạy 1 lần**/rollback không hở số/kiểm vai sau tra khóa/hợp quyền 2 vai; test-support cần token **và** owner, đặt–đóng băng–tua–reset giờ, audit, chạy job |
| `test/integration/seed.test.ts` | 4 | DS-E nạp đủ (13 user, vai, 2 thiết bị, 136 tham số, argon2id), mã khớp; fixture gốc (`GRP-`) → dừng và **không để lại gì**; `--allow-code-drift`; mật khẩu yếu/fixture không giả |
| `test/contract.test.ts`, `test/time.test.ts`, `test/clock.test.ts`, `test/config.test.ts` | 5 + 6 + 7 + 24 | meta OpenAPI không cũ; mọi operation có `x-roles`; bảng `Problem.code`; chuỗi kiểm thử chỉ trong `src/test-support`; mọi handler có `@Operation`/`@PublicRoute`; giờ cơ sở 05:59/06:00, `atLocal` (cả múi có DST), int8 > 2^53 bị từ chối, hash idempotency; MutableClock (đơn vị); cấu hình mục 4 |

## 3. `pnpm seed:ds-e`
- Nạp: tổ chức, cơ sở, 13 tài khoản `qa.*` (mật khẩu `QA_SEED_PASSWORD`, argon2id; `qa.locked` = `locked`), vai, 2 thiết bị (`desk`, `property_tablet` → `facility_mobile`; token ngẫu nhiên 256 bit, chỉ lưu SHA-256, token ghi `tests/fixtures/seed/.out/ds-e.map.json` – đã gitignore, quyền 0600), 134 tham số + `lease_terms` + `utility_estimate` (kiểm kiểu catalogue **và** biên 9.1a), `audit_event seed.loaded`. Một giao dịch – lỗi là không để lại gì.
- **So mã**: mỗi bộ đếm cấp thử mã đầu bằng `DocNumberService` trong SAVEPOINT rồi rollback, so với fixture. Kết quả thật trên `ottimo_test`: `OTM-00001, BG-00001, WO-00001, PT-000001, F26-000001, KH-0001` khớp; **`group`: server `NH-00001` ≠ fixture `GRP-00001` → loader dừng (exit 1)**. Chạy được với `--allow-code-drift` (báo cảnh báo). Thẻ **FB-R2-BE-QA-01** (Major) gửi QA sửa fixture.
- Bỏ qua có báo cáo (bảng chưa có, BE-B Sprint 1): `roomGroups`, `rooms`, `channels`, `minibarItems`, `feeCatalog`, `inspectionChecklist`. `expectedCode` của thực thể (DS-0): có hàm `assertExpectedCode` dừng khi lệch, dùng khi có bảng khách/đơn.

## 4. Sửa theo SEC
- **FB-R2-SEC-BE-01 (Major) – Done**: từ chối tiền tố < /8 (IPv4) và < /16 (IPv6) ở mọi môi trường; staging/production chỉ nhận dải nằm **trọn** trong `127/8`, `10/8`, `172.16/12`, `192.168/16`, `::1`, `fc00::/7` (`172.0.0.0/8` bị từ chối vì rộng hơn `172.16/12`). Ca SEC yêu cầu đều có test.
- **FB-R2-SEC-BE-02 (Minor) – Done**: staging/production thiếu `TRUST_PROXY` → `ConfigError`. Fixture test staging/production đặt `TRUST_PROXY=172.18.0.2` (đã sửa ngay khi ORC báo 8 test đỏ).
- Trả lời thẻ ở `rounds/round-02/responses/BE-responses.md`.

## 5. Chưa làm / chuyển tiếp
| Việc | Lý do | Kế hoạch |
|---|---|---|
| Serializer `x-visible-to` (xóa trường theo vai) | Chưa có DTO nghiệp vụ nào để áp | BE-A giữa Sprint 1 (cùng endpoint đầu tiên của BE-B) |
| CSRF `X-CSRF-Token` + `Origin` (bước 2 thứ tự kiểm) | Cần thiết kế token phiên (không có cột trong `user_session`) – thuộc identity BE-B (đăng nhập) | BE-B Sprint 1; guard đã có chỗ gắn |
| `If-Match` → 412 dùng chung | Guard đã trả 428 khi thiếu; so `version` làm ở use case đầu tiên có PATCH | Sprint 1–2 |
| `idle_expires_at` của phiên | `auth_resolve_session` (erd 2.4) không trả cột này | Đề nghị ARC thêm cột vào danh sách hàm; BE-B làm khi viết đăng nhập |
| 3 hàm đường vào `guest_resolve_token`, `webhook_resolve_property`, `public_resolve_unit` | Bảng `guest_access_token`, `channel_mapping`, `room` chưa có | Tạo cùng migration của các bảng đó |
| `state_transition`, `staff_notification`, `attention_event`, `user_activity_day`, `integration_log` | Ngoài danh sách việc Đợt 0 | Module 10/11 BE-A |
| Ràng buộc chéo khóa và khóa dạng cấu trúc (erd 9.1a "Khóa dạng khác") | Chỉ có biên số/tập; cấu trúc bậc, danh sách % kiểm ở use case `setParameter` | BE-B (platform) Sprint 1, dùng `ParameterService.validate` |
| Lịch pg-boss, outbox dispatcher J18 | Worker hiện tick `setInterval` 1 phút qua `JobRunner` | Sprint 3 (module 11) |
| Cache tham số trong RAM + `LISTEN config_changed` | Đã phát `NOTIFY`, chưa có cache (đọc thẳng DB – đúng nhưng chậm hơn) | Khi đo p95 |
| erd 0.3.1 phần (3) của ARC: `room.base_occupancy`, cột mới `hk_task`, CHECK `reservation.direct_source` | Bảng thuộc Sprint 1–2 | Ghi cho migration của các bảng đó (BE-B/BE-A) |

### Việc cần vai khác (không sửa file của họ)
- **OPS**: (1) `.env.example` + compose: thêm `CLOCK_MODE`, `INCLUDE_TEST_SUPPORT` (biến **chạy**, khác build-arg cùng tên), `TEST_SUPPORT_TOKEN`, `COOKIE_SECURE_PREFIX`; **xóa `CLOCK_OVERRIDE`** (giờ đặt giá trị khác rỗng là api dừng); ghi `TRUST_PROXY` bắt buộc ở staging/production. (2) Dịch vụ `migrate` một lần trong compose (`node dist/db/migrate-cli.js` với `MIGRATION_DATABASE_URL`) trước api/worker; CI smoke có thể chạy migrate trước `/health`. (3) CI bước (b) erd 16.6: `pnpm --filter @ottimo/api exec drizzle-kit generate` không được sinh file mới. (4) `dev-setup.md`: số test mong đợi (`Tests 121 passed`), lệnh `pnpm db:migrate`, `pnpm seed:ds-e`; `.env` máy INV hiện chưa có `QA_SEED_PASSWORD` (chép từ `.env.example`). (5) `turbo.json` test env nếu test cần thêm biến (hiện không cần).
- **ARC**: thêm `INTERNAL_ERROR` (500) vào bảng `Problem.code`; erd 4.3 `entity_id`/`session_id` kiểu text; danh sách cột `auth_resolve_session` (cân nhắc `idle_expires_at`, `status` người dùng); `config_parameter.status_label` là mã tự do dạng `INV-004+GD` (DS-E) chứ không chỉ `GD|NGANH|PL`.
- **QA**: FB-R2-BE-QA-01.

## 6. Kết quả lệnh (thật, 16/10/2026, máy INV: Node 22.23.3, pnpm 9.15.4, PostgreSQL 17.11 compose `ottimo-dev`, DB `ottimo_test`)
| Lệnh | Kết quả | Exit |
|---|---|---|
| `pnpm db:migrate` (vai `ottimo_migrator`) | `{"level":"info","msg":"migrations applied"}` – 4 migration, 48 bảng/phân vùng; chạy lại = no-op | 0 |
| `npx drizzle-kit generate` (kiểm khớp schema ↔ migration) | `No schema changes, nothing to migrate` | 0 |
| `pnpm -s format:check` | `All matched files use Prettier code style!` | 0 |
| `pnpm -s lint` | ESLint sạch; typecheck **9/9** task | 0 |
| `pnpm -s test` (`DATABASE_URL`=ottimo_app, `MIGRATION_DATABASE_URL`=ottimo_migrator) | `@ottimo/api` **Test Files 13 passed, Tests 121 passed (121)**, không skipped (trước: 34); integrations 46; 3 app × 1; Turbo **9/9** | 0 |
| `pnpm -s build` | Turbo **6/6**; `dist/db/migrations` có 4 SQL + meta | 0 |
| `bash infra/ci/check-no-test-surface.sh bundle <dist không có test-support>` | `OK: no test-only code` | 0 |
| `bash infra/ci/check-no-test-surface.sh spec docs/api/openapi.yaml` | `OK` | 0 |
| `node scripts/gen-openapi-meta.mjs --check` (OpenAPI 0.3.1-draft) | `openapi-meta.ts is up to date` | 0 |
| `pnpm audit --audit-level=high` | 1 moderate (esbuild của drizzle-kit, dev) – không High/Critical | 0 |
| Smoke `node dist/main.js` (`APP_ENV=test CLOCK_MODE=mutable INCLUDE_TEST_SUPPORT=1`) | `/health` 200 + `x-request-id`; `/__test__/clock` không token → 401 problem+json | – |
| `node dist/main.js` với `DATABASE_URL` = migrator | `StartupCheckError: … member of it – use ottimo_app` | 1 (đúng ý) |
| `node dist/worker.js` (`APP_ENV=test`) | `worker started`, `job done log.partitions`, dừng sạch khi SIGTERM | 0 |
| `pnpm seed:ds-e` (fixture hiện tại) | `SeedCodeMismatchError: … group: server NH-00001 ≠ fixture GRP-00001` | 1 (đúng ý – chờ QA) |
| `pnpm seed:ds-e --allow-code-drift` | Báo cáo JSON: 13 user, 2 thiết bị, 136 tham số, 6/7 mã khớp, 6 khối bỏ qua | 0 |
| Đối chứng đỏ ban đầu | `config.test.ts` 8 ca staging/production đỏ khi bắt buộc `TRUST_PROXY` → sửa fixture → xanh; `architecture.test.ts` đỏ (vai migrator đọc schema `drizzle` cần `SET ROLE`), `http-foundation.test.ts` đỏ (DI `ProblemFilter`, 3 ca request id/đồng hồ) → sửa → xanh | 1 → 0 |

## 7. Giả định
- Ánh xạ fixture tạm: `group`→`reservation_group`, `receipt`→`payment`, `property_tablet`→`facility_mobile` (tới khi QA sửa).
- `INTERNAL_ERROR` dùng cho lỗi 500 tới khi ARC thêm vào bảng mã.
- `log.partitions` chạy 03:00 (giờ kỹ thuật như J16, không phải tham số nghiệp vụ).
- Hạn thiết bị tin cậy khi seed lấy từ `trusted_device_days`/`trusted_device_mobile_days` (mặc định catalogue 180/30).
- Không có ESC mới.
